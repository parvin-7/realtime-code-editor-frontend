import React, { useEffect, useRef, useState } from 'react';
import Client from '../components/Client';
import Editor from '../components/Editor';
import Output from '../components/Output';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';


function EditorPage() {
    const socketRef = useRef();
    const codeRef = useRef(null);
    const [code, setCode] = useState('');
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    // Get username but don't return early yet
    const username = location.state?.username || localStorage.getItem('username');

    // Use a state to track if we should render the component
    const [shouldRedirect] = useState(!username);

    // Store username in localStorage on first load
    useEffect(() => {
        if (location.state?.username) {
            localStorage.setItem('username', location.state.username);
        }
    }, [location.state]);

    useEffect(() => {
        if (!username) return; // Skip socket initialization if no username

        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('Socket error:', e);
                toast.error('Socket connection failed, try again later');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username,
            });

            socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUsername, socketId }) => {
                
                if (joinedUsername !== username) {
                    toast.success(`${joinedUsername} joined the room`);
                }
                setClients(clients);
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current || '', // Fallback to empty string
                    socketId,
                });
            });

            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUsername }) => {
                toast.success(`${leftUsername} left the room`);
                setClients((prev) => prev.filter(client => client.socketId !== socketId));
            });
        };

        init();

        return () => {
            socketRef.current?.disconnect();
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
        };
    }, [username, roomId, reactNavigator]);

    // Now perform the early return after all hooks
    if (shouldRedirect) {
        reactNavigator('/');
        return null;
    }

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied');
        } catch (error) {
            toast.error('Something went wrong');
        }
    }

    function leaveRoom() {
        localStorage.removeItem('username'); // Clean up on leave
        reactNavigator('/');
    }

    return (
        <div className='mainWrap'>
            <Toaster />
            <div className='aside'>
                <div className='asideInner'>
                    <div className='logo'>
                        <img className='logoImage' src='/codist-logo.png' alt='codist logo' width={200} height={70} />
                    </div>
                    <h3>Connected</h3>
                    <div className='clientsList'>
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className='btn copyBtn' onClick={copyRoomId}>Copy Room Id</button>
                <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
            </div>
            <div className='editorWrap'>
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(newCode) => {
                        codeRef.current = newCode;
                        setCode(newCode);
                    }}
                />
                <Output code={code} />
            </div>
        </div>
    );
}

export default EditorPage;