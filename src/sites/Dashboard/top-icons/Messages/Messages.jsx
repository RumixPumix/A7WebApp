import React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPaperPlane, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import './messagesStyle.css';

function Messages() {
    const conversations = [
        {
            id: 1,
            name: 'John Doe',
            avatar: 'JD',
            lastMessage: 'Hey, how are you doing?',
            time: '10:30 AM',
            unread: true
        },
        {
            id: 2,
            name: 'Sarah Smith',
            avatar: 'SS',
            lastMessage: 'Meeting at 2 PM tomorrow',
            time: 'Yesterday',
            unread: false
        },
        {
            id: 3,
            name: 'Support Team',
            avatar: 'ST',
            lastMessage: 'Your ticket has been resolved',
            time: '2 days ago',
            unread: false
        },
        {
            id: 4,
            name: 'Alex Johnson',
            avatar: 'AJ',
            lastMessage: 'Check out this new feature!',
            time: '1 week ago',
            unread: false
        }
    ];

    const [activeConversation, setActiveConversation] = useState(null);

    return (
        <div className="messages-dropdown">
            <div className="messages-header">
                <h3>Messages</h3>
                <div className="messages-search">
                    <FontAwesomeIcon icon={faSearch} />
                    <input type="text" placeholder="Search messages..." />
                </div>
            </div>
            
            <div className="conversations-list">
                {conversations.map(conversation => (
                    <div 
                        key={conversation.id}
                        className={`conversation-item ${conversation.unread ? 'unread' : ''}`}
                        onClick={() => setActiveConversation(conversation)}
                    >
                        <div className="conversation-avatar">
                            {conversation.avatar}
                        </div>
                        <div className="conversation-info">
                            <div className="conversation-name">
                                {conversation.name}
                                <span className="conversation-time">{conversation.time}</span>
                            </div>
                            <div className="conversation-preview">
                                {conversation.lastMessage}
                                {conversation.unread && <span className="unread-badge"></span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {activeConversation && (
                <div className="conversation-detail">
                    <div className="conversation-header">
                        <div className="conversation-user">
                            <div className="conversation-avatar">
                                {activeConversation.avatar}
                            </div>
                            <div>
                                <h4>{activeConversation.name}</h4>
                                <p>Online</p>
                            </div>
                        </div>
                        <button className="conversation-menu">
                            <FontAwesomeIcon icon={faEllipsisV} />
                        </button>
                    </div>
                    
                    <div className="conversation-messages">
                        <div className="message received">
                            <div className="message-content">
                                Hey there! How are you doing?
                            </div>
                            <div className="message-time">10:30 AM</div>
                        </div>
                        <div className="message sent">
                            <div className="message-content">
                                I'm doing great! Just working on the new project.
                            </div>
                            <div className="message-time">10:32 AM</div>
                        </div>
                    </div>
                    
                    <div className="conversation-input">
                        <input type="text" placeholder="Type a message..." />
                        <button className="send-button">
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Messages;