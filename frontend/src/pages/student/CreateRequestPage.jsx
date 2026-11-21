import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Building,
  Mic,
  Sliders,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';
import aiService from '../../services/ai.service';
import studentService from '../../services/student.service';
import resourceService from '../../services/resource.service';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatTimeRange, formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';

const SUGGESTED_PROMPTS = [
  'Annual Coding Hackathon next Friday from 2 PM to 8 PM with 120 attendees, need an auditorium and 4 wireless mics.',
  'Robotics Workshop this Saturday from 10 AM to 1 PM for 50 students, need a seminar hall and a projector.',
  'Guest Lecture on Artificial Intelligence on Wednesday at 11 AM with 80 students in a seminar hall.',
];

export const CreateRequestPage = () => {
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  // Conversation State
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Active Catalog Resources from backend
  const [activeCatalog, setActiveCatalog] = useState([]);

  // Draft State (accumulated by AI or edited by student)
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    eventType: 'Workshop',
    startAt: '',
    endAt: '',
    attendeeCount: '',
    resources: [], // [{ resourceId, name, category, resourceMode, requestedQuantity, capacity, totalQuantity }]
  });

  const [conversationStage, setConversationStage] = useState('collecting_details');
  const [missingFields, setMissingFields] = useState([]);
  const [clarificationsNeeded, setClarificationsNeeded] = useState([]);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // Availability Verification State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [availabilityError, setAvailabilityError] = useState(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 1. Initialize fresh AI conversation and load resource catalog
  const initWorkspace = async () => {
    setIsInitializing(true);
    setChatError(null);
    setSubmitError(null);
    setAvailabilityResult(null);

    try {
      const [convRes, resRes] = await Promise.all([
        aiService.createConversation(),
        resourceService.getActiveResources(),
      ]);

      if (convRes.success && convRes.data?.conversation) {
        setConversationId(convRes.data.conversation.id);
        setMessages([
          {
            role: 'assistant',
            content:
              "Hello! I'm CampusFlow's AI event coordinator. Tell me what event you are organizing (e.g. topic, anticipated dates, venue needs, and expected attendee count), and I will help structure and verify your request.",
          },
        ]);
      }

      if (resRes.success && resRes.data?.resources) {
        setActiveCatalog(resRes.data.resources);
      }
    } catch (err) {
      setChatError(
        err.response?.data?.message ||
          'Failed to initialize AI coordinator workspace. Please verify backend connectivity.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initWorkspace();
  }, []);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // 2. Handle sending message to AI assistant
  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent || !conversationId || isSending) return;

    setInputMessage('');
    setChatError(null);
    setAvailabilityResult(null); // Reset availability when parameters change

    // Optimistically append user message
    const updatedMessages = [
      ...messages,
      { role: 'user', content: messageContent },
    ];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const response = await aiService.sendMessage(conversationId, messageContent);

      if (response.success && response.data) {
        const { assistantMessage, eventDraft, conversationStage: stage, missingFields: missing, clarificationsNeeded: clarifications } =
          response.data;

        // Append assistant message
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: assistantMessage },
        ]);

        if (stage) setConversationStage(stage);
        if (missing) setMissingFields(missing);
        if (clarifications) setClarificationsNeeded(clarifications);

        // Merge accumulated draft
        if (eventDraft) {
          setDraft((prev) => ({
            ...prev,
            title: eventDraft.title || prev.title,
            description: eventDraft.description || prev.description,
            eventType: eventDraft.eventType || prev.eventType || 'Workshop',
            startAt: eventDraft.startAt || prev.startAt,
            endAt: eventDraft.endAt || prev.endAt,
            attendeeCount: eventDraft.attendeeCount || prev.attendeeCount,
            resources:
              eventDraft.resources && eventDraft.resources.length > 0
                ? eventDraft.resources.map((r) => ({
                    resourceId: r.resourceId,
                    name: r.name,
                    category: r.category,
                    resourceMode: r.resourceMode,
                    requestedQuantity: r.requestedQuantity || (r.resourceMode === 'quantity' ? 1 : undefined),
                  }))
                : prev.resources,
          }));
        }
      }
    } catch (err) {
      setChatError(
        err.response?.data?.message ||
          'The AI assistant encountered an issue processing your request. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  // 3. Resource management in draft
  const handleAddResource = (resourceId) => {
    if (!resourceId) return;
    const target = activeCatalog.find((r) => r._id === resourceId);
    if (!target) return;

    if (draft.resources.some((r) => r.resourceId === target._id)) {
      return; // Already added
    }

    const newRes = {
      resourceId: target._id,
      name: target.name,
      category: target.category,
      resourceMode: target.resourceMode,
      capacity: target.capacity,
      totalQuantity: target.totalQuantity,
      requestedQuantity: target.resourceMode === 'quantity' ? 1 : undefined,
    };

    setDraft((prev) => ({
      ...prev,
      resources: [...prev.resources, newRes],
    }));
    setAvailabilityResult(null);
  };

  const handleRemoveResource = (resourceId) => {
    setDraft((prev) => ({
      ...prev,
      resources: prev.resources.filter((r) => r.resourceId !== resourceId),
    }));
    setAvailabilityResult(null);
  };

  const handleQuantityChange = (resourceId, qty) => {
    const val = Math.max(1, parseInt(qty, 10) || 1);
    setDraft((prev) => ({
      ...prev,
      resources: prev.resources.map((r) =>
        r.resourceId === resourceId ? { ...r, requestedQuantity: val } : r
      ),
    }));
    setAvailabilityResult(null);
  };

  // 4. Real-time availability check
  const handleCheckAvailability = async () => {
    setAvailabilityError(null);
    setAvailabilityResult(null);

    if (!draft.startAt || !draft.endAt) {
      setAvailabilityError('Start and end date/time are required to evaluate availability.');
      return;
    }
    if (new Date(draft.endAt) <= new Date(draft.startAt)) {
      setAvailabilityError('End date/time must be strictly later than start date/time.');
      return;
    }
    if (!draft.attendeeCount || Number(draft.attendeeCount) <= 0) {
      setAvailabilityError('A valid positive expected attendee count is required.');
      return;
    }
    if (!draft.resources || draft.resources.length === 0) {
      setAvailabilityError('At least one venue or equipment resource must be selected.');
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const response = await studentService.checkAvailability({
        startAt: new Date(draft.startAt).toISOString(),
        endAt: new Date(draft.endAt).toISOString(),
        attendeeCount: Number(draft.attendeeCount),
        requestedResources: draft.resources.map((r) => ({
          resourceId: r.resourceId,
          requestedQuantity: r.requestedQuantity,
        })),
      });

      if (response.success && response.data) {
        setAvailabilityResult(response.data);
      }
    } catch (err) {
      setAvailabilityError(
        err.response?.data?.message ||
          'Failed to verify resource availability. Please try again.'
      );
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // 5. Final request submission
  const handleSubmitRequest = async () => {
    setSubmitError(null);

    // Final client-side checks
    if (!draft.title || draft.title.trim().length < 2) {
      setSubmitError('Event title must be at least 2 characters long.');
      return;
    }
    if (!draft.description || draft.description.trim().length < 5) {
      setSubmitError('Event description must be at least 5 characters long.');
      return;
    }
    if (!draft.startAt || !draft.endAt) {
      setSubmitError('Valid start and end date/time are required.');
      return;
    }
    if (new Date(draft.endAt) <= new Date(draft.startAt)) {
      setSubmitError('End date/time must be after start date/time.');
      return;
    }
    if (!draft.attendeeCount || Number(draft.attendeeCount) <= 0) {
      setSubmitError('Attendee count must be a positive number.');
      return;
    }
    if (!draft.resources || draft.resources.length === 0) {
      setSubmitError('Please select at least one campus resource for your event.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await studentService.createEventRequest({
        title: draft.title,
        description: draft.description,
        eventType: draft.eventType,
        startAt: new Date(draft.startAt).toISOString(),
        endAt: new Date(draft.endAt).toISOString(),
        attendeeCount: draft.attendeeCount,
        requestedResources: draft.resources,
        conversationId: conversationId || undefined,
      });

      if (response.success && response.data?.request) {
        navigate(`/student/requests/${response.data.request._id}`);
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          'Failed to submit event request. Please check resource availability and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format ISO to datetime-local input string
  const toLocalInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Event Request Assistant"
        description="Collaborate with CampusFlow's AI event coordinator to define your event parameters, verify resource availability, and submit for faculty review."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={RotateCcw}
            onClick={initWorkspace}
            disabled={isInitializing}
          >
            Start New Conversation
          </Button>
        }
      />

      {isInitializing ? (
        <div className="py-20 text-center bg-white rounded-lg border border-surface-border p-8">
          <Loader2 className="w-8 h-8 text-campus-700 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">
            Initializing AI Event Workspace...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Loading active campus resource inventory and session parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              LEFT COLUMN: CONVERSATION INTERFACE (7 cols)
              ======================================================== */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-surface-border shadow-soft flex flex-col h-[700px] overflow-hidden">
            {/* Chat Header Status Bar */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-campus-600 animate-pulse" />
                <span className="text-xs font-semibold text-slate-900">
                  CampusFlow AI Coordinator
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {conversationStage === 'ready_for_review'
                  ? 'Stage: Ready for Review'
                  : 'Stage: Collecting Details'}
              </span>
            </div>

            {/* Error Banner inside Chat */}
            {chatError && (
              <div className="p-3 bg-rose-50 border-b border-rose-200">
                <Alert variant="error" onClose={() => setChatError(null)}>
                  {chatError}
                </Alert>
              </div>
            )}

            {/* Scrollable Message Thread */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3 max-w-[85%]',
                      isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 text-xs shadow-soft',
                        isAssistant
                          ? 'bg-campus-700 text-white'
                          : 'bg-slate-900 text-white'
                      )}
                    >
                      {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div
                      className={cn(
                        'p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap text-xs shadow-soft',
                        isAssistant
                          ? 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80'
                          : 'bg-campus-700 text-white rounded-tr-none'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                  <div className="w-7 h-7 rounded-full bg-campus-700 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-slate-100 text-slate-500 rounded-xl rounded-tl-none border border-slate-200 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-campus-700" />
                    <span className="text-xs">Analyzing event requirements...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-slate-50/60 border-t border-surface-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-[11px] bg-white hover:bg-campus-50 hover:text-campus-900 text-slate-600 px-2.5 py-1 rounded border border-slate-200 transition-colors truncate max-w-xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Bar */}
            <div className="p-4 bg-white border-t border-surface-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Describe your event or answer follow-up questions..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isSending}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-campus-600 focus:ring-1 focus:ring-campus-600 disabled:bg-slate-50"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={Send}
                  disabled={!inputMessage.trim() || isSending}
                >
                  Send
                </Button>
              </form>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Press Enter to send. The assistant extracts event parameters into the live summary on the right.
              </p>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: LIVE STRUCTURED DRAFT & AVAILABILITY (5 cols)
              ======================================================== */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Draft Container */}
            <div className="bg-white rounded-lg border border-surface-border shadow-soft p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-campus-600" />
                  <h3 className="text-sm font-bold text-slate-900">Structured Event Draft</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingDraft(!isEditingDraft)}
                  className="text-xs font-semibold text-campus-700 hover:text-campus-900 hover:underline"
                >
                  {isEditingDraft ? 'Done Editing' : 'Edit Manually'}
                </button>
              </div>

              {/* Missing Fields Checklist */}
              {missingFields.length > 0 && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Required parameters needed:
                  </p>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-amber-800">
                    {missingFields.map((field) => (
                      <li key={field}>
                        Missing <strong>{field}</strong> &ndash; describe it in chat or edit below.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clarification Warnings */}
              {clarificationsNeeded.length > 0 && (
                <div className="p-3 rounded-md bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-1">
                  <p className="font-semibold">Clarification Needed:</p>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-sky-800">
                    {clarificationsNeeded.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Draft Fields View or Edit Mode */}
              {isEditingDraft ? (
                <div className="space-y-3 text-xs">
                  <Input
                    label="Event Title"
                    value={draft.title}
                    placeholder="e.g. Annual Hackathon"
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />

                  <Select
                    label="Event Category"
                    value={draft.eventType}
                    onChange={(e) => setDraft({ ...draft, eventType: e.target.value })}
                    options={[
                      { value: 'Workshop', label: 'Workshop' },
                      { value: 'Seminar', label: 'Seminar' },
                      { value: 'Hackathon', label: 'Hackathon' },
                      { value: 'Cultural', label: 'Cultural Fest' },
                      { value: 'Technical', label: 'Technical Competition' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={toLocalInput(draft.startAt)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            startAt: e.target.value ? new Date(e.target.value).toISOString() : '',
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={toLocalInput(draft.endAt)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            endAt: e.target.value ? new Date(e.target.value).toISOString() : '',
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <Input
                    label="Expected Attendee Count"
                    type="number"
                    min="1"
                    value={draft.attendeeCount}
                    placeholder="e.g. 100"
                    onChange={(e) => setDraft({ ...draft, attendeeCount: e.target.value })}
                  />

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Event Description
                    </label>
                    <textarea
                      rows={3}
                      value={draft.description}
                      placeholder="Brief purpose and schedule of your event..."
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      className="w-full p-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-campus-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-md border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Title
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {draft.title || <span className="text-slate-400 font-normal italic">Pending...</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Category
                      </span>
                      <p className="font-medium text-slate-800">{draft.eventType || 'Workshop'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Expected Attendees
                      </span>
                      <p className="font-mono font-medium text-slate-800">
                        {draft.attendeeCount ? `${draft.attendeeCount} students` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Schedule Window
                    </span>
                    <p className="text-slate-800 mt-0.5 font-medium">
                      {draft.startAt && draft.endAt
                        ? formatTimeRange(draft.startAt, draft.endAt)
                        : <span className="text-slate-400 italic">Dates pending in chat...</span>}
                    </p>
                  </div>

                  {draft.description && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Description
                      </span>
                      <p className="text-slate-700 line-clamp-3 mt-0.5 leading-relaxed">
                        {draft.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Resources List */}
              <div className="pt-3 border-t border-surface-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-900">
                    Selected Resources ({draft.resources.length})
                  </span>
                </div>

                {draft.resources.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded text-center">
                    No resources selected yet. Mention them in chat or select from catalog below.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {draft.resources.map((res) => (
                      <div
                        key={res.resourceId}
                        className="p-2.5 rounded bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {res.resourceMode === 'capacity' ? (
                              <Building className="w-3.5 h-3.5 text-campus-700" />
                            ) : (
                              <Mic className="w-3.5 h-3.5 text-sky-700" />
                            )}
                            {res.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {res.resourceMode === 'capacity'
                              ? `Venue (Max Capacity: ${res.capacity || 'N/A'})`
                              : `Equipment &bull; Quantity Tracked`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {res.resourceMode === 'quantity' && (
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-500">Qty:</span>
                              <input
                                type="number"
                                min="1"
                                max={res.totalQuantity || 20}
                                value={res.requestedQuantity || 1}
                                onChange={(e) =>
                                  handleQuantityChange(res.resourceId, e.target.value)
                                }
                                className="w-14 px-1.5 py-0.5 rounded border border-slate-300 text-xs text-center"
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveResource(res.resourceId)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Resource Dropdown */}
              <div className="pt-2">
                <Select
                  placeholder="+ Add campus venue or equipment..."
                  options={activeCatalog
                    .filter((cat) => !draft.resources.some((r) => r.resourceId === cat._id))
                    .map((cat) => ({
                      value: cat._id,
                      label: `${cat.name} (${cat.resourceMode === 'capacity' ? `Venue, Cap: ${cat.capacity}` : `Equip, Stock: ${cat.totalQuantity}`})`,
                    }))}
                  onChange={(e) => {
                    handleAddResource(e.target.value);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Real-Time Availability Checker Button */}
              <div className="pt-3 border-t border-surface-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleCheckAvailability}
                  isLoading={isCheckingAvailability}
                >
                  Verify Real-Time Availability
                </Button>
              </div>

              {/* Availability Feedback Box */}
              {availabilityError && (
                <Alert variant="error" onClose={() => setAvailabilityError(null)}>
                  {availabilityError}
                </Alert>
              )}

              {availabilityResult && (
                <div
                  className={cn(
                    'p-3.5 rounded-md border text-xs space-y-2',
                    availabilityResult.overallAvailable
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  )}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {availabilityResult.overallAvailable ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>All Requested Resources Available</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Availability Conflict Detected</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {availabilityResult.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between text-[11px] gap-2 pt-1 border-t border-black/5"
                      >
                        <span className="font-semibold">{item.resourceName}:</span>
                        <span
                          className={cn(
                            'text-right',
                            item.available ? 'text-emerald-700' : 'text-rose-700 font-semibold'
                          )}
                        >
                          {item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Error */}
              {submitError && (
                <Alert variant="error" onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}

              {/* Final Submit Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  rightIcon={ArrowRight}
                  onClick={handleSubmitRequest}
                  isLoading={isSubmitting}
                  disabled={
                    !draft.title ||
                    !draft.description ||
                    !draft.startAt ||
                    !draft.endAt ||
                    !draft.attendeeCount ||
                    draft.resources.length === 0 ||
                    (availabilityResult && !availabilityResult.overallAvailable)
                  }
                >
                  Submit Request for Faculty Review
                </Button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Once submitted, the request status will be marked <strong>Under Review</strong> and queued for administrative decision.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRequestPage;
