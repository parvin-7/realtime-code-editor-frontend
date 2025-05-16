import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';

const Editor = ({ roomId, onCodeChange, socketRef }) => {
  const editorRef = useRef();

  useEffect(() => {
    editorRef.current = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
      mode: 'javascript',
      theme: 'dracula',
      lineNumbers: true,
    });

    editorRef.current.on('change', (instance) => {
      const code = instance.getValue();
      onCodeChange(code);
      if (socketRef.current) {
        socketRef.current.emit('code-change', { roomId, code });
      }
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea(); // Properly clean up CodeMirror instance
      }
    };
  }, [onCodeChange, roomId, socketRef]);

  useEffect(() => {
    if (!socketRef.current) {
      console.log('Socket not initialized, skipping code-change listener setup');
      return;
    }

    const socket = socketRef.current;
    if (typeof socket.on === 'function') {
      console.log('Setting up code-change listener');
      socket.on('code-change', ({ code }) => {
        if (editorRef.current) {
          editorRef.current.setValue(code);
        }
      });
    } else {
      console.warn('Socket does not have on method, skipping listener setup');
      return;
    }

    return () => {
      const currentSocket = socketRef.current;
      if (currentSocket) {
        if (typeof currentSocket.off === 'function') {
          console.log('Cleaning up code-change listener');
          currentSocket.off('code-change');
        } else {
          console.warn('Socket cleanup skipped: off method not available');
        }
      } else {
        console.warn('Socket cleanup skipped: socketRef.current is undefined');
      }
    };
  }, [socketRef]);

  return (
    <div>
      <textarea id="code-editor" />
    </div>
  );
};

export default Editor;