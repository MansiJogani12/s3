import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MessageSquare, Send, Users, GraduationCap, Edit2, Trash2, Paperclip, Reply, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const StudentChatPage = ({ facultyMode = false, specificGroupId = null, specificProjectId = null }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [replyingToMsg, setReplyingToMsg] = useState(null);

  const [activeChannelType, setActiveChannelType] = useState('GROUP'); // GROUP, FACULTY, PERSONAL
  const [selectedReceiverId, setSelectedReceiverId] = useState(null); // for PERSONAL
  
  const chatEndRef = useRef(null);

  // Fetch Group Members for Group Chat Details
  const { data: groupData } = useQuery({
    queryKey: ['myGroup'],
    queryFn: async () => {
      const res = await API.get('/groups/my-group');
      return res.data;
    },
  });

  // Fetch Messages based on active channel
  const { data: chatData, isLoading } = useQuery({
    queryKey: ['collabChat', activeChannelType, selectedReceiverId, specificProjectId],
    queryFn: async () => {
      const params = new URLSearchParams({ channelType: activeChannelType });
      if (specificProjectId) {
        params.append('projectId', specificProjectId);
      }
      if (activeChannelType === 'PERSONAL' && selectedReceiverId) {
        params.append('receiverId', selectedReceiverId);
      }
      const res = await API.get(`/collaboration/chat?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 3000,
    enabled: !(activeChannelType === 'PERSONAL' && !selectedReceiverId)
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData]);

  const sendMsgMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await API.post('/collaboration/chat', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collabChat']);
      resetInput();
    },
  });

  const updateMsgMutation = useMutation({
    mutationFn: async ({ id, content }) => {
      const res = await API.put(`/collaboration/chat/${id}`, { content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collabChat']);
      resetInput();
    },
  });

  const deleteMsgMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/collaboration/chat/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collabChat']);
    }
  });

  const resetInput = () => {
    setContent('');
    setAttachmentUrl('');
    setEditingMsgId(null);
    setReplyingToMsg(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !attachmentUrl) return;

    if (editingMsgId) {
      updateMsgMutation.mutate({ id: editingMsgId, content });
    } else {
      sendMsgMutation.mutate({
        content,
        attachmentUrl,
        replyToId: replyingToMsg?._id || null,
        channelType: activeChannelType,
        receiverId: selectedReceiverId,
        ...(specificProjectId && { projectId: specificProjectId })
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAttachmentUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const messages = chatData?.messages || [];

  return (
    <div className="flex h-[calc(100vh-100px)] max-h-[800px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Sidebar - Channels */}
      <div className="w-1/4 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" /> Project Chat
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Group Chat */}
          <button
            onClick={() => { setActiveChannelType('GROUP'); resetInput(); }}
            className={`w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-all ${
              activeChannelType === 'GROUP' ? 'bg-indigo-100 border-indigo-200 shadow-xs' : 'hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${activeChannelType === 'GROUP' ? 'text-indigo-700' : 'text-slate-500'}`} />
              <span className={`font-bold text-sm ${activeChannelType === 'GROUP' ? 'text-indigo-900' : 'text-slate-700'}`}>Project Group</span>
            </div>
            <span className="text-xs text-slate-500 pl-6">General discussion</span>
          </button>

          {/* Faculty Chat */}
          <button
            onClick={() => { setActiveChannelType('FACULTY'); setSelectedReceiverId(null); resetInput(); }}
            className={`w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-all ${
              activeChannelType === 'FACULTY' ? 'bg-purple-100 border-purple-200 shadow-xs' : 'hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className={`w-4 h-4 ${activeChannelType === 'FACULTY' ? 'text-purple-700' : 'text-slate-500'}`} />
              <span className={`font-bold text-sm ${activeChannelType === 'FACULTY' ? 'text-purple-900' : 'text-slate-700'}`}>Faculty Discussion</span>
            </div>
            <span className="text-xs text-slate-500 pl-6">Ask guides/mentors</span>
          </button>

          {/* Individual DMs - Hidden for Faculty */}
          {!facultyMode && (
            <div className="pt-4 pb-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase px-2 mb-2">Direct Messages</h3>
              {groupData?.members && groupData.members.filter(m => m.user._id !== user._id).length > 0 ? (
                groupData.members.filter(m => m.user._id !== user._id).map(m => (
                  <button
                    key={m.user._id}
                    onClick={() => { setActiveChannelType('PERSONAL'); setSelectedReceiverId(m.user._id); resetInput(); }}
                    className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-all ${
                      activeChannelType === 'PERSONAL' && selectedReceiverId === m.user._id ? 'bg-blue-100 border-blue-200 shadow-xs text-blue-900' : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeChannelType === 'PERSONAL' && selectedReceiverId === m.user._id ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                      {m.user.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-sm truncate">{m.user.name}</span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500 px-2 italic">You are the only member in this group.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-3/4 flex flex-col bg-slate-50/50 relative">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-xs z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${activeChannelType === 'GROUP' ? 'bg-indigo-100 text-indigo-700' : activeChannelType === 'FACULTY' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {activeChannelType === 'GROUP' ? <Users className="w-5 h-5" /> : activeChannelType === 'FACULTY' ? <GraduationCap className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {activeChannelType === 'GROUP' ? 'Group Chat' : activeChannelType === 'FACULTY' ? 'Faculty Discussion' : 'Direct Message'}
              </h3>
              <p className="text-xs text-slate-500">{activeChannelType === 'PERSONAL' ? 'Private conversation' : 'Real-time collaboration'}</p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading messages..." /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId?._id === user._id;

              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative`}>
                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    
                    {/* Sender Name */}
                    {!isMine && (
                      <span className="text-xs font-bold text-slate-500 mb-1 ml-1">{msg.senderId?.name}</span>
                    )}

                    {/* Message Bubble */}
                    <div className={`relative px-4 py-2.5 rounded-2xl shadow-xs ${
                      isMine ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}>
                      
                      {/* Replying To Reference */}
                      {msg.replyToId && (
                        <div className={`text-xs mb-2 p-2 rounded-lg border-l-2 ${isMine ? 'bg-indigo-700/50 border-indigo-300 text-indigo-100' : 'bg-slate-50 border-indigo-400 text-slate-500'}`}>
                          <span className="font-bold block mb-0.5">{msg.replyToId.senderId?.name || 'Someone'}</span>
                          <span className="truncate block max-w-xs italic">"{msg.replyToId.content}"</span>
                        </div>
                      )}

                      {/* Message Content */}
                      {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

                      {/* Attachments */}
                      {msg.attachmentUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-black/10">
                          {msg.attachmentUrl.startsWith('data:image') ? (
                            <img src={msg.attachmentUrl} alt="attachment" className="max-w-xs max-h-48 object-cover" />
                          ) : (
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`text-xs underline ${isMine ? 'text-white' : 'text-indigo-600'}`}>View Attachment</a>
                          )}
                        </div>
                      )}

                      {/* Timestamp & Status */}
                      <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {msg.isEdited && <span className="italic">(edited)</span>}
                        {isMine && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </div>

                    {/* Quick Actions (Hover) */}
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 shadow-sm border border-slate-200 rounded-lg p-1 ${
                      isMine ? '-left-24' : '-right-10'
                    }`}>
                      <button onClick={() => { setReplyingToMsg(msg); setEditingMsgId(null); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100" title="Reply">
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      {isMine && (
                        <>
                          <button onClick={() => { setEditingMsgId(msg._id); setContent(msg.content); setReplyingToMsg(null); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if(window.confirm('Delete message?')) deleteMsgMutation.mutate(msg._id); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 p-4">
          
          {/* Replying / Editing Context Bar */}
          {(replyingToMsg || editingMsgId) && (
            <div className="mb-3 px-4 py-2 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg flex justify-between items-center">
              <div className="text-xs text-indigo-900">
                {editingMsgId ? (
                  <span className="font-bold flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> Editing Message</span>
                ) : (
                  <>
                    <span className="font-bold flex items-center gap-1"><Reply className="w-3.5 h-3.5"/> Replying to {replyingToMsg?.senderId?.name}</span>
                    <span className="block truncate text-indigo-700/80 mt-0.5 italic max-w-md">"{replyingToMsg?.content}"</span>
                  </>
                )}
              </div>
              <button onClick={resetInput} className="text-indigo-400 hover:text-indigo-700"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Attachment Preview */}
          {attachmentUrl && !editingMsgId && (
            <div className="mb-3 inline-flex items-center gap-2 p-2 pr-3 bg-slate-100 rounded-lg border border-slate-200">
              <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-slate-200">
                 {attachmentUrl.startsWith('data:image') ? <ImageIcon className="w-5 h-5 text-indigo-500"/> : <Paperclip className="w-5 h-5 text-indigo-500"/>}
              </div>
              <span className="text-xs font-bold text-slate-700">Attachment added</span>
              <button onClick={() => setAttachmentUrl('')} className="ml-2 text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4"/></button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-3 relative">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-shadow">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={editingMsgId ? "Edit your message..." : "Type a message..."}
                rows="2"
                className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none max-h-32"
              ></textarea>
              
              {!editingMsgId && (
                <div className="flex justify-between items-center px-2 pb-2 bg-slate-50">
                  <div className="flex items-center gap-1">
                    <label className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors" title="Attach Image/File">
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                      <Paperclip className="w-4 h-4" />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium px-2 hidden md:block">Press Enter to send, Shift+Enter for new line</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sendMsgMutation.isPending || updateMsgMutation.isPending || (!content.trim() && !attachmentUrl)}
              className="p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0 h-[52px] w-[52px] flex items-center justify-center mb-0.5"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentChatPage;
