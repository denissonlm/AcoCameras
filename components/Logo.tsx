import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// This is for the report generator, it will always be red.
export const logoSvgString = `<svg width="160" height="40" viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg">
    <text
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
        font-size="30"
        font-weight="bold"
        fill="#CC0000"
        y="30"
    >
        <tspan x="0">Λ</tspan>
        <tspan x="22">çotubo</tspan>
    </text>
</svg>`;


const Logo = () => {
    const { theme } = useTheme();
    const fillColor = theme === 'dark' ? '#F97316' : '#CC0000'; // Orange for dark, Red for light

    // This is for the UI, it's dynamic
    const dynamicLogoSvgString = `<svg width="160" height="40" viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg">
    <text
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
        font-size="30"
        font-weight="bold"
        fill="${fillColor}"
        y="30"
    >
        <tspan x="0">Λ</tspan>
        <tspan x="22">çotubo</tspan>
    </text>
</svg>`;

    return <div dangerouslySetInnerHTML={{ __html: dynamicLogoSvgString }} aria-label="Açotubo Logo" />;
};

export default Logo;