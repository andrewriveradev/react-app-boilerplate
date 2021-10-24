import { useState } from 'react';
import { Redirect } from 'react-router';

function Home() {
    const [ redirect, setRedirect ] = useState();

    if (redirect) {
        return <Redirect push to={redirect} />;
    }

    return (
        <>
            <div className={'font-brush-script font-size-2em'}>Home</div>
            <button onClick={() => setRedirect('/about')}>Go to About</button>
            <button onClick={() => setRedirect('/animeSearch')}>Go to anime search</button>
        </>
    );
}

export default Home;
