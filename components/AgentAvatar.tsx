
import React from 'react';
import { AgentName } from '../types';
import AuraIcon from './icons/AuraIcon';
import MuseIcon from './icons/MuseIcon';
import SoraIcon from './icons/SoraIcon';
import GeminiIcon from './icons/GeminiIcon';
import UserIcon from './icons/UserIcon';

interface AgentAvatarProps {
    agent: AgentName;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ agent }) => {
    const getAgentStyle = () => {
        switch (agent) {
            case AgentName.AURA:
                return { icon: <AuraIcon />, color: 'bg-pink-500/20 text-pink-300' };
            case AgentName.MUSE:
                return { icon: <MuseIcon />, color: 'bg-green-500/20 text-green-300' };
            case AgentName.SORA:
                return { icon: <SoraIcon />, color: 'bg-cyan-500/20 text-cyan-300' };
            case AgentName.USER:
                return { icon: <UserIcon />, color: 'bg-blue-500/20 text-blue-300' };
            case AgentName.SYSTEM:
                 return { icon: <GeminiIcon />, color: 'bg-red-500/20 text-red-300' };
            default:
                return { icon: <GeminiIcon />, color: 'bg-purple-500/20 text-purple-300' };
        }
    };

    const { icon, color } = getAgentStyle();

    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
            {icon}
        </div>
    );
};

export default AgentAvatar;
