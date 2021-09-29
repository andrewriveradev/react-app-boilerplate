import React from 'react';

interface AboutProps {
    className?: string;
}

function About(props: AboutProps = {}): React.ReactNode {
    return (
        <>
            <div className={props.className}>About</div>
        </>
    );
}

About.defaultProps = {
    className: 'font-size-2em',
};

export default About;
